#!/usr/bin/env bash
get_instance_tags(){
   instance_id=$(/usr/bin/curl --silent http://169.254.169.254/latest/meta-data/instance-id)
   echo $(aws ec2 describe-tags --region "us-west-2" --filters "Name=resource-id,Values=$instance_id")
}
tags_to_env () {
    tags=$1

    echo $tags

    for key in $(echo $tags | /usr/bin/jq/jq -r ".[][].Key"); do
        value=$(echo $tags | /usr/bin/jq/jq -r ".[][] | select(.Key==\"$key\") | .Value")
        key=$(echo $key | /usr/bin/tr '-' '_' | /usr/bin/tr '[:lower:]' '[:upper:]')
        rm /home/ec2-user/my-app/.env
        touch /home/ec2-user/my-app/.env
        chown $USER:$USER .env
        echo $key="$value" >> /home/ec2-user/my-app/.env
    done
}
instance_tags=$(get_instance_tags)
tags_to_env "$instance_tags"
