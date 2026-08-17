from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If the response is None, it means an unhandled exception occurred (500)
    if response is None:
        return Response({
            'error': 'Internal Error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # If it's a standard DRF error, we can still customize the format if we want
    # For now, we'll just ensure it returns a consistent 'error' or 'message' key
    if response is not None:
        custom_data = {
            'error': 'Validation Error or Bad Request',
            'details': response.data
        }
        response.data = custom_data

    return response
