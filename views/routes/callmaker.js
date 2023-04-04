const express = require("express");
const router = express.Router();

// router.use(logger);

// router.get("/", (req, res) => {
//   console.log(req.query.name);
//   res.send("Callmaker List");
// });

// router.get("/new", (req, res) => {
//   res.render("callmaker/new");
// });

// router.post("/", (req, res) => {
//   const isValid = false;
//   if (isValid) {
//     users.push({ firstName: req.body.firstName });
//     res.redirect(`/callmaker/${users.length - 1}`);
//   } else {
//     console.log("Error");
//     res.render("callmaker/new", { firstName: req.body.firstName });
//   }
// });

// router
//   .route("/:id")
//   .get((req, res) => {
//     console.log(req.user);
//     res.send(`Get User With ID ${req.params.id}`);
//   })
//   .put((req, res) => {
//     res.send(`Update User With ID ${req.params.id}`);
//   })
//   .delete((req, res) => {
//     res.send(`Delete User With ID ${req.params.id}`);
//   });

// const users = [{ name: "Kyle" }, { name: "Sally" }];
// router.param("id", (req, res, next, id) => {
//   req.user = users[id];
//   next();
// });

// function logger(req, res, next) {
//   console.log(req.originalUrl);
//   next();
// }

const { loadCallMaker } = require("../CallMakerModel");
const { loadCallTaker } = require("../callTakerModel");

router.get("/callTaker", (req, res) => {
  res.json(loadCallTaker());
});
var CalltakerId = function (req, res, next) {
  req.CalltakerId = loadCallTaker().find((data) => data.status === "online").id;
  next();
};
router.post("/callMaker", CalltakerId, (req, res) => {
  const data = {
    cellid: loadCallMaker().length + 1,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  };
  loadCallMaker().push(data);
  console.log("Call Maker data " + data.cellid);
  console.log("Call Taker ID:" + req.CalltakerId);
  res.send({ CMID: data.cellid, CTID: req.CalltakerId });
});

module.exports = router;
