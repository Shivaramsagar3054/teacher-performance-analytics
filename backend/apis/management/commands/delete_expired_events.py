from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apis.models import Event

class Command(BaseCommand):
    help = 'Delete events whose end_date was more than 3 days ago'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=3)
        expired_events = Event.objects.filter(end_date__lt=cutoff)
        count = expired_events.count()
        deleted_count, _ = expired_events.delete()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} event(s) older than 3 days past end_date.')
        )
