#!/usr/bin/env bash
npm uninstall bcrypt
npm uninstall forever
npm uninstall grunt
npm uninstall mimer
npm uninstall es5-ext
npm install -g grunt --save
npm install
npm install --save sails-hook-parametized-policies
sudo grunt prod
sudo chmod -R 0755 ./data
sudo chown -R $USER ./data
sudo chmod -R 501 ./.tmp
sudo chmod -R 501 ./views
get_instance_tags(){
   instance_id=$(/usr/bin/curl --silent http://169.254.169.254/latest/meta-data/instance-id)
   echo $(aws ec2 describe-tags --region "us-west-2" --filters "Name=resource-id,Values=$instance_id")
}
tags_to_env () {
    tags=$1

    for key in $(echo $tags | /usr/bin/jq/jq -r ".[][].Key"); do
        value=$(echo $tags | /usr/bin/jq/jq -r ".[][] | select(.Key==\"$key\") | .Value")
        key=$(echo $key | /usr/bin/tr '-' '_' | /usr/bin/tr '[:lower:]' '[:upper:]')
        export $key="$value"
    done
}
instance_tags=$(get_instance_tags)
tags_to_env "$instance_tags"
