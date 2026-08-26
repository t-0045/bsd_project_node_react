const jwt = require("jsonwebtoken")
const { accessSecret } = require("./auth")

const requireAuth = (request, response, next) => {
  const authorization = request.headers.authorization || ""
  const [scheme, token] = authorization.split(" ")
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: "Access token is required" })
  }

  try {
    request.user = jwt.verify(token, accessSecret)
    return next()
  } catch {
    return response.status(401).json({ error: "Invalid or expired access token" })
  }
};

const validateBody = (fields) => {
  return (request, response, next) => {
    const missing = fields.filter((field) => request.body[field] === undefined || request.body[field] === null || request.body[field] === "")
    if (missing.length > 0) {
      return response.status(400).json({ error: `Required fields: ${missing.join(", ")}` })
    }
    return next()
  };
};

module.exports = { requireAuth, validateBody }
