const fastify = require('fastify')
const fs = require('fs')
const path = require('path')
const fastifyPassport = require('fastify-passport')
const { Strategy: Github } = require('passport-github2')
const fastifySecureSession = require('fastify-secure-session')

const server = fastify({
  https: {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/localhost.cert')
  }
})

server.register(fastifySecureSession, { key: fs.readFileSync(path.join(__dirname, 'secure.key')) })
server.register(fastifyPassport.initialize())
server.register(fastifyPassport.secureSession())

fastifyPassport.use(
  'github',
  new Github.Strategy(
    {
      clientID: '',
      clientSecret: '',
      callbackURL: 'https://localhost:3000/callback',
      scope: ['user:email', 'user,user:email'],
      userProfileURL: 'https://api.github.com/user',
      state: 'test-state',
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      done(null, { ...profile, accessToken })
    }
  )
)

server.get(
  '/github',
  {
    preValidation: fastifyPassport.authenticate('github', {
      successRedirect: '/callback',
      authInfo: false,
      assignProperty: 'user'
    })
  },
  () => {}
)

server.get(
  '/callback',
  {
    preValidation: fastifyPassport.authenticate('github', {
      authInfo: false,
      session: false
    })
  },
  async (request, reply, err, user = {}, info = {}, status = {}) => {
    reply.send({ user: request.user || {} })
  }
)

server.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err
  console.log(`server listening on ${address}`)
})
