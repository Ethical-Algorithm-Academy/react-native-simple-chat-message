getProperty(){
  grep "^$2=" "$1" | cut -d'=' -f2
}

TMP_KEYSTORE_FILE_PATH="SimpleChatApp/android/keystore"
echo "Create TMP Folder $TMP_KEYSTORE_FILE_PATH"
ls -l
mkdir -p $TMP_KEYSTORE_FILE_PATH
ls -l
echo $keystoreFile | base64 -di > "${TMP_KEYSTORE_FILE_PATH}"/keys.jks
# echo $debugKeystoreFile | base64 -di > "${TMP_KEYSTORE_FILE_PATH}"/debugKeys.jks

echo "Setting keystore.properties file with release keystore"
echo "# KeyStore Configuration
storeFile=../keystore/keys.jks
storePassword=$password
keyAlias=$alias
keyPassword=$password" > "${TMP_KEYSTORE_FILE_PATH}"/keystore.properties

keystoreProperties="${TMP_KEYSTORE_FILE_PATH}"/keystore.properties
if [ -f "$keystoreProperties" ]; then
  echo "keystoreProperties found."
  storeFile=$( getProperty "${keystoreProperties}" "storeFile")
  storePassword=$( getProperty "${keystoreProperties}" "storePassword")
  keyAlias=$( getProperty "${keystoreProperties}" "keyAlias")
  keyPassword=$( getProperty "${keystoreProperties}" "keyPassword")
  echo "storeFile = "${storeFile}
  echo "storePassword = "${storePassword}
  echo "keyAlias = "${keyAlias}
  echo "keyPassword = "${keyPassword}
else
  echo "$keystoreProperties not found."
fi
