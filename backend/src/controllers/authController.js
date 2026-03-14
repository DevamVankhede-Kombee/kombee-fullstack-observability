const authService = require('../services/authService');
const { validationResult } = require('express-validator');
const { logger } = require('../logger');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('kombee-backend');

class AuthController {
  async register(req, res, next) {
    const span = tracer.startSpan('AuthController.register', {}, context.active());
    try {
      const { name, email, password } = req.body;
      span.setAttribute('email', email);
      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.route', '/api/auth/register');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: '/api/auth/register',
          errors: errors.array()
        });
        span.setAttribute('validation.failed', true);
        span.setAttribute('validation.error_count', errors.array().length);
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const result = await authService.register(name, email, password);

      span.setAttribute('user.id', result.user.id);
      span.setAttribute('result.success', true);

      logger.info('User registered', {
        email,
        userId: result.user.id
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      next(error);
    } finally {
      span.end();
    }
  }

  async login(req, res, next) {
    const span = tracer.startSpan('AuthController.login', {}, context.active());
    try {
      const { email, password } = req.body;
      span.setAttribute('email', email);
      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.route', '/api/auth/login');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: '/api/auth/login',
          errors: errors.array()
        });
        span.setAttribute('validation.failed', true);
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        const result = await authService.login(email, password);
        
        span.setAttribute('user.id', result.user.id);
        span.setAttribute('result.success', true);

        logger.info('User login success', {
          email,
          userId: result.user.id
        });

        res.status(200).json({
          success: true,
          data: result
        });
      } catch (loginError) {
        if (loginError.statusCode === 401) {
          logger.warn('User login failed', {
            email,
            reason: 'invalid credentials'
          });
          span.setAttribute('auth.failed', true);
        }
        throw loginError;
      }
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      next(error);
    } finally {
      span.end();
    }
  }
}

module.exports = new AuthController();
