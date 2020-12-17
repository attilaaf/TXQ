#!/bin/sh
USERNAME=ubuntu
KEYFILEPATH="/Users/atman/bpkey.pem"

HOSTNAME=ec2-54-187-28-96.us-west-2.compute.amazonaws.com
echo "Starting deploy to server... $HOSTNAME"
rsync -rav -e "ssh -i $KEYFILEPATH"  --progress --exclude-from='./excludefiles.txt' ./ ubuntu@$HOSTNAME:~/txq
 

echo "\nDone. Bye..."
exit


# csshX --login ubuntu --ssh_args '-i /Users/sauron/git/me/bp_ec2_keypair.pem' ec2-54-187-156-108.us-west-2.compute.amazonaws.com ec2-54-187-28-96.us-west-2.compute.amazonaws.com

