This uses image input to add Images to etherpad, it's based on ep_copy_paste_images module but without drag drop functionality.
Plugin needs S3 config in etherpads settings.json file
"ep_image_upload":{
    "s3":{
      "accessKeyId": "YOUR_S3_ACCESS_KEY",
      "secretAccessKey": "YOUR_S3_ACCESS_KEY_SECRET",
      "region": "YOUR_REGION",
      "bucket": "BUCKET_NAME",
      "baseFolder": "FOLDER_PATH"
    }
  },
"fileTypes": ["jpeg", "jpg", "bmp", "gif","png", ...etc], // if left blanck file mime type is checked to match image.*
"maxFileSize": 5000000 //file size in bytes if not set there is no limit
