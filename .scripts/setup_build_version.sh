setProperty(){
  awk -v pat="^$1=" -v value="$1=$2" '{ if ($0 ~ pat) print value; else print $0; }' $3 > $3.tmp
  mv $3.tmp $3
}

getProperty(){
  grep "^$2=" "$1" | cut -d'=' -f2
}

echo "Increase build and version Number"

file="./android/gradle.properties"
if [ -f "$file" ]; then
  echo "$file found."

  setProperty "appVersion" "$appVersion" "$file"
  setProperty "appBuild" "$appBuild" "$file"

else
  echo "$file not found."
fi