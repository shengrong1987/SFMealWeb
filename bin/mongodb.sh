#!/bin/bash

APP_DIR="/home/ec2-user/my-app"
#
# mongodb     Startup script for the mongodb server
#
# chkconfig: - 64 36
# description: MongoDB Database Server
#
# processname: mongodb
#

# Source function library
. /etc/rc.d/init.d/functions

if [ -f /etc/sysconfig/mongodb ]; then
	. /etc/sysconfig/mongodb
fi

prog="mongod"
mongod="mongod"
RETVAL=0

start() {
	echo -n $"Starting $prog: "
	chown -R $USER:$USER "$APP_DIR/data"
	truncate -s 0 /var/log/mongodb.log
	daemon $mongod -dbpath "$APP_DIR/data" --replSet rs0 --auth --smallfiles "--fork --logpath /var/log/mongodb.log --logappend 2>&1 >>/var/log/mongodb.log"
	RETVAL=$?
	echo
	[ $RETVAL -eq 0 ] && touch /var/lock/subsys/$prog
	return $RETVAL
}

stop() {
	echo -n $"Stopping $prog: "
	killproc $prog
	RETVAL=$?
	echo
	[ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/$prog
	truncate -s 0 /var/log/mongodb.log
	return $RETVAL
}

reload() {
	echo -n $"Reloading $prog: "
	killproc $prog -HUP
	RETVAL=$?
	echo
	return $RETVAL
}

case "$1" in
	start)
		start
		;;
	stop)
		stop
		;;
	restart)
		stop
		start
		;;
	condrestart)
		if [ -f /var/lock/subsys/$prog ]; then
			stop
			start
		fi
		;;
	reload)
		reload
		;;
	status)
		status $mongod
		RETVAL=$?
		;;
	*)
		echo $"Usage: $0 {start|stop|restart|condrestart|reload|status}"
		RETVAL=1
esac

exit $RETVAL
