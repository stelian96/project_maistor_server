const express = require("express");
const Service = require("../models/service");
const auth = require("../middleware/auth");
const router = new express.Router();
const multer = require("multer");
const path = require("path");

function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaeeeeiiiioooouuuunc------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    console.log(file);
    const fileName =
      Date.now() +
      path.basename(file.originalname) +
      path.extname(file.originalname);
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });

router.post(
  "/services/:id/images",
  auth,
  upload.array("images", 7),
  async (req, res) => {
    try {
      // 1. Find Service
      const service = await Service.findOne({
        _id: req.params.id,
        ownerId: req.user._id,
      });

      if (!service) {
        return res.status(404).send();
      }

      // 2. Create Array with images sended from client.
      let imageArray = [];
      for (let i = 0; i < req.files.length; i++) {
        imageArray.push("/images/" + req.files[i].filename);
      }
      service.images = imageArray;
      await service.save();
      res.send(service);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);

router.post("/services", auth, async (req, res) => {
  const service = new Service({
    ...req.body,
    ownerId: req.user._id,
    ownerName: req.user.name,
    ownerAvatar: req.user.avatar,
    slug: string_to_slug(req.body.name) + Date.now(),
  });

  try {
    await service.save();
    res.status(201).send(service);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/services/me", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.premium) {
    match.premium = req.query.premium === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "services",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.services);
  } catch (e) {
    res.status(500).send();
  }
});

// GET /services?premium=true
// GET /services?limit=10&skip=20
// GET /services?sortBy=createdAt:desc
router.get("/services", async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.premium) {
    match.premium = req.query.premium === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    Service.find({}, function (err, service) {
      // let serviceMap = [];

      // service.forEach(singleService => {
      //   // serviceMap[service._id] = service;
      //   console.log(singleService)
      //   serviceMap.push = singleService;
      // });

      res.send(service);
    });
    //     .populate({
    //       path: "services",
    //       match,
    //       options: {
    //         limit: parseInt(req.query.limit),
    //         skip: parseInt(req.query.skip),
    //         sort,
    //       },
    //     })
    //     .execPopulate();
    //   res.send(req.user.services);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/services/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    const service = await Service.findOne({ slug });

    if (!service) {
      return res.status(404).send();
    }

    res.send(service);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/services/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const service = await Service.findOne({ _id, ownerId: req.user._id });

    if (!service) {
      return res.status(404).send();
    }

    res.send(service);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/services/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "premium, name, price, images"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const service = await Service.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!service) {
      return res.status(404).send();
    }

    updates.forEach((update) => (service[update] = req.body[update]));
    await service.save();
    res.send(service);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/services/:id", auth, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!service) {
      res.status(404).send();
    }

    res.send(service);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
