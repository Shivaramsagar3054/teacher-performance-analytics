import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Comment, Teacher, User
from .serializers import CommentSerializer

class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.teacher_id = self.scope['url_route']['kwargs']['teacher_id']
            self.room_group_name = f'teacher_{self.teacher_id}'

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            
            # Automatically send comment history upon connection
            comments = await self.get_recent_comments(self.teacher_id)
            await self.send(text_data=json.dumps({
                'type': 'comment_history',
                'comments': comments
            }))
            
        except Exception as e:
            print(f"Connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Invalid JSON'}))
            return

        message_type = data.get('type')

        if message_type == 'post_comment':
            comment_content = data.get('content')
            user_id = data.get('user_id')
            is_anonymous = data.get('is_anonymous', False)
            parent_id = data.get('parent_id')

            if not comment_content or not user_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Content and user_id are required'
                }))
                return

            # Save comment to database
            comment = await self.save_comment(user_id, self.teacher_id, comment_content, is_anonymous, parent_id)
            
            if comment:
                # Serialize the comment
                comment_data = await self.serialize_comment(comment)

                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'comment_message',
                        'comment': comment_data
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to save comment. User or Teacher may not exist.'
                }))

        elif message_type == 'fetch_history':
            comments = await self.get_recent_comments(self.teacher_id)
            await self.send(text_data=json.dumps({
                'type': 'comment_history',
                'comments': comments
            }))

        elif message_type == 'typing':
            is_typing = data.get('is_typing', False)
            user_name = data.get('user_name', 'Someone')
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_message',
                    'is_typing': is_typing,
                    'user_name': user_name,
                    'sender_channel_name': self.channel_name
                }
            )

    # Receive message from room group
    async def comment_message(self, event):
        comment = event['comment']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_comment',
            'comment': comment
        }))

    async def typing_message(self, event):
        # Don't send typing status back to the person who is typing
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'type': 'typing_status',
                'is_typing': event['is_typing'],
                'user_name': event['user_name']
            }))

    @database_sync_to_async
    def get_recent_comments(self, teacher_id):
        comments = Comment.objects.filter(teacher_id=teacher_id, status='approved').order_by('created_at')[:50]
        return CommentSerializer(comments, many=True).data

    @database_sync_to_async
    def save_comment(self, user_id, teacher_id, content, is_anonymous, parent_id=None):
        try:
            user = User.objects.get(id=user_id)
            teacher = Teacher.objects.get(id=teacher_id)
            comment = Comment.objects.create(
                user=user,
                teacher=teacher,
                content=content,
                is_anonymous=is_anonymous,
                status='approved',
                parent=Comment.objects.get(id=parent_id) if parent_id else None
            )
            return comment
        except (User.DoesNotExist, Teacher.DoesNotExist):
            return None
        except Exception as e:
            print(f"Error saving comment: {e}")
            return None

    @database_sync_to_async
    def serialize_comment(self, comment):
        return CommentSerializer(comment).data
