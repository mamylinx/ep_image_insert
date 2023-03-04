# Image support within Etherpad with resize

### Installation

````sh
npm install --no-save --legacy-peer-deps ep_image_insert
```

Plugin to upload images to Etherpad (https://etherpad.org/).

Supported storages:
- Base 64 - default
- Local (disk) storage
- Amazon S3

### Base64 

Images are converted to base64 and stored inside etherpad document
Sample configuration in `settings.json` for using with base64:
``` javascript
"ep_image_insert": {
    "fileTypes": ["jpeg", "jpg", "bmp", "gif", "png"],
    "maxFileSize": 5000000
}
```

`fileTypes` - if left blank file mime-type is checked to match `image.*`

`maxFileSize` - file size in bytes. If not set there is no limit

### Local (disk) storage

Local (disk) storage needs config for accessing files from web

Sample configuration in `settings.json` for using with local (disk) 
storage:
``` javascript
"ep_image_insert":{
    "storage":{
      "type": "local",
      "baseFolder": "src/static/images",
      "baseURL": "http://www.my-site.com/static/images/"
    },
    "fileTypes": ["jpeg", "jpg", "bmp", "gif","png"],
    "maxFileSize": 5000000
  },
```

`fileTypes` - if left blank file mime-type is checked to match `image.*`

`maxFileSize` - file size in bytes. If not set there is no limit

`baseURL` - URL path to "baseFolder". For example if `baseFolder` is 
"/path/to/my_etherpad_folder/src/static/images" then 
`http://myetherpad.com:9001/static/images/`

### Amazon S3 storage

Sample configuration in `settings.json` for using with Amazon S3:
``` javascript
"ep_image_insert":{
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

