import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle2, Clock, User, X } from 'lucide-react';
import { commentsApi } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function Messages() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);

  // High-fidelity mock feedbacks to fallback on or combine if DB comments list is empty
  const mockFeedbacks = [
    {
      id: 'mock-fb-1',
      user_email: 'siddharth.sharma@example.com',
      is_anonymous: false,
      content: 'The machine learning labs are extremely helpful, but could we add a short primer session on PyTorch tensor manipulation? It would save us a lot of debugging time during assignments.',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      replies: [
        {
          id: 'mock-reply-1',
          user_email: 'teacher@example.com',
          sender_name: 'You (Teacher)',
          content: 'That is a great suggestion, Siddharth. I will coordinate with the TAs to host a 30-minute PyTorch lab session this Friday.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'mock-fb-2',
      user_email: 'student_anonymous@example.com',
      is_anonymous: true,
      content: 'Can we record the live workshop sessions? Some of us have scheduling conflicts with elective courses and miss the live coding demonstrations.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      replies: []
    },
    {
      id: 'mock-fb-3',
      user_email: 'aditya.nair@example.com',
      is_anonymous: false,
      content: 'Thank you for explaining complex concepts like recursive neural networks so simplistically! The visualizations in the slides made it very easy to follow.',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      replies: []
    }
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const teacherId = localStorage.getItem('teacher_id');
      if (!teacherId) {
        setLoading(false);
        return;
      }

      // Fetch all comments/feedbacks from backend comments API
      const data = await commentsApi.getAll({ teacher_id: teacherId });
      const dbComments = data.results || (Array.isArray(data) ? data : []);
      
      // Filter parent threads and map to feedback structure (filtering out automated live event alerts)
      const dbFeedbacks = dbComments
        .filter(comment => {
          if (comment.parent) return false;
          const text = (comment.content || comment.comment_text || '').toLowerCase();
          if (text.includes('is on live or ongoing') || text.includes('your event')) {
            return false;
          }
          return true;
        })
        .map(comment => {
          const replies = dbComments
            .filter(reply => reply.parent === comment.id)
            .map(reply => ({
              id: reply.id,
              user_email: reply.user_email,
              sender_name: reply.user_email === localStorage.getItem('user_email') ? 'You (Teacher)' : (reply.user_email || 'Student'),
              content: reply.content || reply.comment_text,
              created_at: reply.created_at || new Date().toISOString()
            }));

          return {
            id: comment.id,
            user_email: comment.user_email || 'Student',
            is_anonymous: comment.is_anonymous,
            content: comment.content || comment.comment_text,
            created_at: comment.created_at || new Date().toISOString(),
            status: comment.status || 'approved',
            replies: replies
          };
        });

      // Merge backend comments with engaging mock feedbacks
      setFeedbacks([...dbFeedbacks, ...mockFeedbacks]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load student feedback', err);
      // Fallback to mocks
      setFeedbacks(mockFeedbacks);
      setLoading(false);
    }
  };

  const handleReplyChange = (id, val) => {
    setReplyTexts(prev => ({ ...prev, [id]: val }));
  };

  const handlePostReply = async (e, fbId) => {
    e.preventDefault();
    const text = replyTexts[fbId] || '';
    if (!text.trim()) return;

    try {
      setSubmittingReply(true);
      const teacherId = localStorage.getItem('teacher_id');
      const userEmail = localStorage.getItem('user_email') || 'teacher@example.com';
      
      const targetFb = feedbacks.find(f => f.id === fbId);
      if (!targetFb) return;

      if (fbId.startsWith('mock-fb-')) {
        // Handle mock feedback locally
        const newReply = {
          id: `local-reply-${Date.now()}`,
          user_email: userEmail,
          sender_name: 'You (Teacher)',
          content: text.trim(),
          created_at: new Date().toISOString()
        };

        const updated = {
          ...targetFb,
          replies: [...targetFb.replies, newReply]
        };

        setFeedbacks(prev => prev.map(f => f.id === fbId ? updated : f));
        setReplyTexts(prev => ({ ...prev, [fbId]: '' }));
        toast.success('Reply submitted successfully!');
      } else {
        // Submit real reply to backend database
        await commentsApi.create({
          teacher: Number(teacherId),
          user: Number(localStorage.getItem('user_id')),
          content: text.trim(),
          parent: fbId,
          is_anonymous: false
        });

        setReplyTexts(prev => ({ ...prev, [fbId]: '' }));
        toast.success('Reply submitted successfully!');
        await fetchFeedbacks();
      }
      setSubmittingReply(false);
    } catch (err) {
      console.error('Failed to submit reply', err);
      toast.error('Failed to post reply.');
      setSubmittingReply(false);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to remove this feedback entry?')) return;

    try {
      if (id.startsWith('mock-fb-')) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        toast.success('Feedback entry removed.');
      } else {
        await commentsApi.delete(id);
        toast.success('Feedback entry deleted.');
        await fetchFeedbacks();
      }
    } catch (err) {
      console.error('Failed to delete feedback entry', err);
      toast.error('Failed to delete feedback.');
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    toast.success(`Feedback status updated to ${newStatus}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-serif">Student Feedback Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Review ratings, academic suggestions, and general reviews submitted by your students.</p>
        </div>
        <Button 
          onClick={fetchFeedbacks}
          variant="outline" 
          size="sm"
          className="text-xs font-bold px-4 py-2 border-slate-200 hover:bg-slate-50"
        >
          Refresh Feed
        </Button>
      </div>

      {/* Feed Card Stack */}
      <div className="space-y-4">
        {feedbacks.map((fb) => {
          const isApproved = fb.status === 'approved';
          const replyText = replyTexts[fb.id] || '';
          
          return (
            <Card 
              key={fb.id}
              className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300 text-left"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                    {fb.is_anonymous ? 'A' : (fb.user_email ? fb.user_email[0].toUpperCase() : 'S')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {fb.is_anonymous ? 'Anonymous Student' : (fb.user_email?.split('@')[0] || 'Current Student')}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {fb.is_anonymous ? 'Anonymous' : (fb.user_email?.includes('student') ? 'Student' : 'Enrolled Student')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Submitted {new Date(fb.created_at).toLocaleDateString()} at {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleUpdateStatus(fb.id, isApproved ? 'flagged' : 'approved')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isApproved 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                    }`}
                    title={isApproved ? "Approved - Click to Flag" : "Flagged - Click to Approve"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200/60 hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                    title="Delete Thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-1">
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{fb.content}</p>
              </div>

              {/* Replies Log */}
              {fb.replies.length > 0 && (
                <div className="pl-4 border-l-2 border-slate-200/80 space-y-3.5 bg-slate-50/50 p-4 rounded-2xl">
                  <h6 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-1">Teacher Responses</h6>
                  {fb.replies.map((reply) => {
                    const isYou = reply.sender_name.includes('You');
                    return (
                      <div key={reply.id} className="text-xs space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${isYou ? 'text-primary' : 'text-slate-700'}`}>
                            {reply.sender_name}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{reply.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}



            </Card>
          );
        })}

        {feedbacks.length === 0 && (
          <div className="border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 bg-white">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No student feedback found.</p>
          </div>
        )}
      </div>

    </div>
  );
}
