
package com.andrewma.vision.webserver.controllers;

import java.util.Date;
import java.util.List;

import android.content.Context;

import com.andrewma.vision.database.DatabaseHelper;
import com.andrewma.vision.models.Glasses;
import com.andrewma.vision.models.ScoredGlasses;
import com.andrewma.vision.utils.PerfLogger;
import com.andrewma.vision.webserver.core.Controller;
import com.andrewma.vision.webserver.core.NanoHTTPD;
import com.andrewma.vision.webserver.core.VisionHTTPD;
import com.andrewma.vision.webserver.core.annotations.Action;

public class GlassesController extends Controller {

    final DatabaseHelper dbHelper;
    final GlassesScoring scorer = new GlassesScoring();
    private List<Glasses> cache = null;

    public GlassesController(Context context) {
        super();
        dbHelper = DatabaseHelper.getInstance(context);
    }

    private List<Glasses> getGlasses() {
        if (cache == null) {
            cache = dbHelper.getAll(Glasses.class);
        }
        return cache;
    }

    @Action
    public Result Search(Glasses query) {
        PerfLogger.log("Search", "GlassesController.Search start");
        final List<Glasses> glasses = getGlasses();
        PerfLogger.log("Search", "Get glasses");
        final List<ScoredGlasses> results = scorer.score(query, glasses, 100);
        PerfLogger.stop("Search", "--Score glasses");
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, results);
    }

    @Action
    public Result GetAll() {
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, getGlasses());
    }

    @Action
    public Result Get(int id) {
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, dbHelper.get(Glasses.class, id));
    }

    @Action
    public synchronized Result Add(Glasses glasses) {
        // figure out which group this pair goes to. the algorithm for this is
        // rounding the OD (right) Sph value away from 0
        boolean positive = (glasses.OD_Spherical >= 0);
        glasses.Group = (int) Math.ceil(Math.abs(glasses.OD_Spherical));
        // anything over 10 gets grouped into the 20 group
        if (glasses.Group > 10) {
            glasses.Group = 20;
        }
        if (!positive) {
            glasses.Group *= -1;
        }

        // find number
        final List<Glasses> glassesInGroup = dbHelper.executeSql(Glasses.class,
                "SELECT * FROM Glasses WHERE [Group] = " + glasses.Group);
        int max = 0;
        for (Glasses g : glassesInGroup) {
            if (g.Number > max)
                max = g.Number;
        }
        glasses.Number = max + 1;

        glasses.AddedDate = new Date();

        glasses.GlassesId = (int) dbHelper.insert(glasses);

        // if database couldn't insert glasses, it will return -1 as the ID
        if (glasses.GlassesId == -1) {
            return ErrorResult("Could not add glasses. Error on db.insert.");
        }
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, glasses);
    }

    @Action
    public Result Update(Glasses update) {
        final Glasses original = (Glasses) dbHelper.get(Glasses.class, update.GlassesId);

        update.Group = original.Group;
        update.Number = original.Number;
        update.AddedDate = original.AddedDate;

        // if update(...) returns 0, then no rows were updated
        if (dbHelper.update(update) == 0) {
            return ErrorResult("Could not update glasses. Error on db.update.");
        }
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, update);
    }

    @Action
    public Result Delete(int id) {
        if (cache != null) {
            final List<Glasses> glasses = getGlasses();
            for (int i = 0; i < glasses.size(); i++) {
                if (glasses.get(i).GlassesId == id) {
                    glasses.remove(i);
                    break;
                }
            }
        }

        dbHelper.delete(Glasses.class, id);
        return Result(NanoHTTPD.HTTP_OK, VisionHTTPD.MIME_JSON, String.format("%d deleted", id));
    }
}
