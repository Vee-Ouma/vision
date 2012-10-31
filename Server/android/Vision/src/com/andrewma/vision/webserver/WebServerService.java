package com.andrewma.vision.webserver;

import com.andrewma.vision.MainActivity;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

public class WebServerService extends Service {

	private static final String TAG = "WebServerService";
	private static final String NOTIFICATION_TITLE = "Vision Web Server";

	@Override
	public IBinder onBind(Intent arg0) {
		return null;
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		Log.v(TAG, "Starting Web Server Service");

		final Notification note = new Notification(
				android.R.drawable.ic_dialog_info, "Starting Vision Web Server Service",
				System.currentTimeMillis());
		final Intent i = new Intent(this, MainActivity.class);
		i.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
				| Intent.FLAG_ACTIVITY_SINGLE_TOP);
		final PendingIntent pi = PendingIntent.getActivity(this, 0, i, 0);

		note.setLatestEventInfo(this, NOTIFICATION_TITLE,
				"Web Server Running...", pi);
		note.flags |= Notification.FLAG_NO_CLEAR;

		startForeground(1337, note);

		return (START_NOT_STICKY);
	}

	@Override
	public void onDestroy() {
		Log.v(TAG, "Stopping Web Server Service");
		super.onDestroy();
	}
}
