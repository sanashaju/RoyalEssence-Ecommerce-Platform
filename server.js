import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { engine } from "express-handlebars";
import cookieParser from "cookie-parser";
import compression from "compression";

import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRouts.js";
import userRoutes from "./routes/userRoutes.js";
import { verifyUser } from "./middleware/verifyUser.js";
/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* MIDDLEWARE */
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(cookieParser());

app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(compression());

/* STATIC FILES */
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(
  "/adminAssets",
  express.static(path.join(__dirname, "public/adminAssets"))
);
app.use(
  "/userAssets",
  express.static(path.join(__dirname, "public/userAssets"))
);

/* VIEW ENGINE SETUP — SHOULD BE BEFORE ROUTES */
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "user",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    helpers: {
      upper: (str) => str.toUpperCase(),
      json: (context) => JSON.stringify(context),
      eq: (a, b) => a === b,
      or: (a, b) => a || b,
      formatDate: (timestamp) =>
        new Date(timestamp).toLocaleDateString("en-GB"),
      ifEquals: function (arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      },
    },
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

/* DATABASE CONNECTION */
await connectDB();

// Apply user verification before user routes
app.use((req, res, next) => {
  // Skip for admin routes
  if (req.originalUrl.startsWith("/admin")) return next();

  verifyUser(req, res, () => {
    // Make logged-in user available globally in all HBS views
    res.locals.loggedInUser = req.loggedInUser;
    next();
  });
});

/* ROUTES */
app.use("/admin", adminRoutes);
app.use("/", userRoutes);

/* 404 HANDLER */
app.use((req, res, next) => {
  res.status(404).render("error-404");
});

/* GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render("error-404");
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(
    `💻 process ID ${process.pid}: server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`
  );
});
