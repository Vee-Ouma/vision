﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Vision.Models;

namespace Vision.Controllers
{
    public class AddController : Controller
    {
        VisionContext context = new VisionContext();

        public ActionResult Add()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Add(Glasses glasses)
        {
            // figure out which group this pair goes to. the algorith for this is rounding the OD (right) Sph value away from 0
            bool positive = (glasses.OD_Spherical >= 0);
            glasses.Group = (int)Math.Ceiling(Math.Abs(glasses.OD_Spherical));
            // anything over 10 gets grouped into the 20 group
            if (glasses.Group > 10)
                glasses.Group = 20;
            if (!positive)
                glasses.Group *= -1;

            // grab all glasses in this group so that I can look for the next pair of glasses
            var numbers = context.Glasses.Where(g => g.Group == glasses.Group).Select(g => g.Number).OrderBy(g => g).ToArray();
            glasses.Number = numbers.Length > 0 ? numbers.Max() + 1 : 1;

            // try to look for a gap. If there is a gap in the number, fill it in.
            for (int i = 0; i < numbers.Length; i++)
            {
                if (numbers[i] != i + 1)
                {
                    glasses.Number = i + 1;
                    break;
                }
            }

            // add UTC date time stamp
            glasses.InsertDate = DateTime.UtcNow;

            context.Glasses.Add(glasses);
            context.SaveChanges();

            return Json(glasses);
        }

        [HttpPost]
        public ActionResult Remove(int group, int number)
        {
            var glasses = context.Glasses.Single(g => g.Group == group && g.Number == number);
            context.Glasses.Remove(glasses);
            var history = new GlassesHistory(glasses);
            history.RemovalDate = DateTime.UtcNow;
            context.GlassesHistory.Add(history);
            context.SaveChanges();

            return Json(true);
        }
    }
}