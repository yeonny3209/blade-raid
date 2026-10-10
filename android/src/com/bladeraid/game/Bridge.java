package com.bladeraid.game;

import android.app.Activity;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** 웹의 '기록 카드 저장' 버튼이 이미지를 갤러리(Pictures/BladeRaid)에 저장한다 */
    class Bridge {
    private final Activity act;
    Bridge(Activity a) { act = a; }

        @JavascriptInterface
        public boolean saveImage(String base64, String name) {
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                    v.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    v.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/BladeRaid");
                    Uri uri = act.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                    OutputStream os = act.getContentResolver().openOutputStream(uri);
                    os.write(data); os.close();
                } else {
                    File dir = new File(act.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "BladeRaid");
                    dir.mkdirs();
                    FileOutputStream os = new FileOutputStream(new File(dir, name));
                    os.write(data); os.close();
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }
