#Plugin to upload images to etherpad

This uses image input to add Images to etherpad, it's based on ep_copy_paste_images module but without drag drop functionality.

Currently only amazon S3 and local storage are supported.
Default storage is local

Plugin needs S3 config in etherpads settings.json file
``` javascript
"ep_image_upload":{
    "storage":{
      "type": "S3",
      "accessKeyId": "YOUR_S3_ACCESS_KEY",
      "secretAccessKey": "YOUR_S3_ACCESS_KEY_SECRET",
      "region": "YOUR_REGION",
      "bucket": "BUCKET_NAME",
      "baseFolder": "FOLDER_PATH"
    },
    "fileTypes": ["jpeg", "jpg", "bmp", "gif","png"],
    "maxFileSize": 5000000
  },
```

```"fileTypes"``` -> if left blank file mime-type is checked to match image.*

```"maxFileSize"``` -> file size in bytes. If not set there is no limit

Local storage needs config for accessing files from web

``` javascript
"ep_image_upload":{
    "storage":{
      "type": "local",
      "baseFolder": "/var/www/images",
      "baseURL": "http://www.my-site.com/images/"
    },
    "fileTypes": ["jpeg", "jpg", "bmp", "gif","png"],
    "maxFileSize": 5000000 
  },
```

```"baseFolder"``` -> Path to filesystem folder that is accessible from browser. For example to add images to etherpad subfolder then ```"/path/to/my_etherpad_folder/src/static/images"```

```"baseURL"``` -> URL path to "baseFolder". For example if ```"baseFolder"``` is "/path/to/my_etherpad_folder/src/images"``` then ```http://myetherpad.com:9001/static/images/"``` 

Also button ```"addImage"``` must be added under ```"toolbar"```
for example:

```
"toolbar": {
    "left": [
      [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "addImage"
      ]
}
```
