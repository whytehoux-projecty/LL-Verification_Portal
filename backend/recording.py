"""
Session recording utilities for storing recordings to S3
"""
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
import logging
from typing import Optional
import os

logger = logging.getLogger(__name__)


class RecordingManager:
    """Manage session recordings and upload to S3"""
    
    def __init__(self):
        self.s3_client = None
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "lexnova-recordings")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        
        # Initialize S3 client if credentials are available
        if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=self.aws_region
            )
            logger.info(f"S3 client initialized for bucket: {self.bucket_name}")
        else:
            logger.warning("AWS credentials not found. Recording upload disabled.")
    
    async def upload_recording(
        self,
        session_id: str,
        file_path: str,
        recording_type: str = "video"
    ) -> Optional[str]:
        """
        Upload a recording file to S3
        
        Args:
            session_id: The session ID
            file_path: Local path to the recording file
            recording_type: Type of recording (video, audio, transcript)
        
        Returns:
            S3 URL of the uploaded file, or None if upload failed
        """
        if not self.s3_client:
            logger.error("S3 client not initialized. Cannot upload recording.")
            return None
        
        try:
            # Generate S3 key
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(file_path)[1]
            s3_key = f"sessions/{session_id}/{recording_type}_{timestamp}{file_extension}"
            
            # Upload file
            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': self._get_content_type(file_extension),
                    'Metadata': {
                        'session_id': session_id,
                        'recording_type': recording_type,
                        'uploaded_at': datetime.utcnow().isoformat()
                    }
                }
            )
            
            # Generate URL
            url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"
            logger.info(f"Recording uploaded successfully: {url}")
            return url
        
        except ClientError as e:
            logger.error(f"Failed to upload recording to S3: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading recording: {e}")
            return None
    
    async def upload_transcript(
        self,
        session_id: str,
        transcript_text: str
    ) -> Optional[str]:
        """
        Upload a transcript to S3
        
        Args:
            session_id: The session ID
            transcript_text: The transcript content
        
        Returns:
            S3 URL of the uploaded transcript
        """
        if not self.s3_client:
            logger.error("S3 client not initialized. Cannot upload transcript.")
            return None
        
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            s3_key = f"sessions/{session_id}/transcript_{timestamp}.txt"
            
            # Upload transcript
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=transcript_text.encode('utf-8'),
                ContentType='text/plain',
                Metadata={
                    'session_id': session_id,
                    'type': 'transcript',
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"
            logger.info(f"Transcript uploaded successfully: {url}")
            return url
        
        except ClientError as e:
            logger.error(f"Failed to upload transcript to S3: {e}")
            return None
    
    async def get_presigned_url(
        self,
        session_id: str,
        file_key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Generate a presigned URL for accessing a recording
        
        Args:
            session_id: The session ID
            file_key: The S3 key of the file
            expiration: URL expiration time in seconds (default: 1 hour)
        
        Returns:
            Presigned URL
        """
        if not self.s3_client:
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.txt': 'text/plain',
            '.json': 'application/json'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')


# Global recording manager instance
recording_manager = RecordingManager()
