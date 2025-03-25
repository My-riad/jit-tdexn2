import { Router } from 'express';
import axios from 'axios';
import { ServiceRegistry, SERVICES } from '../config';
import { authenticate } from '../middleware/authentication';
import { validateRequest } from '../middleware/request-validator';

const router = Router();

/**
 * Creates a proxy handler function that forwards requests to the market intelligence service
 * 
 * @param endpoint - The endpoint on the market intelligence service to forward to
 * @returns Express request handler function
 */
const createProxyHandler = (endpoint: string) => {
  return async (req, res, next) => {
    try {
      // Get the market intelligence service instance
      const marketService = ServiceRegistry.getServiceInstance(SERVICES.MARKET_INTELLIGENCE_SERVICE);
      
      // Create dynamic endpoint by replacing path parameters
      let targetUrl = endpoint;
      Object.keys(req.params).forEach(param => {
        targetUrl = targetUrl.replace(`:${param}`, req.params[param]);
      });
      
      // Forward the request
      const response = await marketService.circuitBreaker.fire({
        method: req.method,
        url: `${marketService.service.url}${targetUrl}`,
        data: req.body,
        params: req.query,
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization
        }
      });
      
      // Return the response
      return res.status(response.status).json(response.data);
    } catch (error) {
      next(error);
    }
  };
};

// Market Rates Routes
router.get('/rates', authenticate, createProxyHandler('/rates'));
router.get('/rates/historical', authenticate, createProxyHandler('/rates/historical'));
router.post('/rates/calculate', authenticate, validateRequest, createProxyHandler('/rates/calculate'));
router.post('/rates/load', authenticate, validateRequest, createProxyHandler('/rates/load'));
router.get('/rates/trends', authenticate, createProxyHandler('/rates/trends'));
router.get('/rates/supply-demand', authenticate, createProxyHandler('/rates/supply-demand'));

// Forecast Routes (specific routes first)
router.get('/forecasts/latest', authenticate, createProxyHandler('/forecasts/latest'));
router.get('/forecasts/region', authenticate, createProxyHandler('/forecasts/region'));
router.get('/forecasts/lane', authenticate, createProxyHandler('/forecasts/lane'));
router.get('/forecasts/high-demand/regions', authenticate, createProxyHandler('/forecasts/high-demand/regions'));
router.get('/forecasts/high-demand/lanes', authenticate, createProxyHandler('/forecasts/high-demand/lanes'));
router.get('/forecasts/:id', authenticate, createProxyHandler('/forecasts/:id'));
router.get('/forecasts', authenticate, createProxyHandler('/forecasts'));
router.post('/forecasts/generate', authenticate, validateRequest, createProxyHandler('/forecasts/generate'));

// Hotspot Routes (specific routes first)
router.get('/hotspots/active', authenticate, createProxyHandler('/hotspots/active'));
router.get('/hotspots/type', authenticate, createProxyHandler('/hotspots/type'));
router.get('/hotspots/severity', authenticate, createProxyHandler('/hotspots/severity'));
router.get('/hotspots/region', authenticate, createProxyHandler('/hotspots/region'));
router.get('/hotspots/equipment', authenticate, createProxyHandler('/hotspots/equipment'));
router.get('/hotspots/nearby', authenticate, createProxyHandler('/hotspots/nearby'));
router.post('/hotspots/detect', authenticate, validateRequest, createProxyHandler('/hotspots/detect'));
router.get('/hotspots/:id', authenticate, createProxyHandler('/hotspots/:id'));
router.put('/hotspots/:id/deactivate', authenticate, createProxyHandler('/hotspots/:id/deactivate'));
router.put('/hotspots/:id', authenticate, validateRequest, createProxyHandler('/hotspots/:id'));
router.delete('/hotspots/:id', authenticate, createProxyHandler('/hotspots/:id'));
router.get('/hotspots', authenticate, createProxyHandler('/hotspots'));
router.post('/hotspots', authenticate, validateRequest, createProxyHandler('/hotspots'));

// Auction Routes (specific routes first)
router.get('/auctions/:id/bids', authenticate, createProxyHandler('/auctions/:id/bids'));
router.get('/auctions/:id/evaluate', authenticate, createProxyHandler('/auctions/:id/evaluate'));
router.put('/auctions/:id/start', authenticate, createProxyHandler('/auctions/:id/start'));
router.put('/auctions/:id/end', authenticate, createProxyHandler('/auctions/:id/end'));
router.put('/auctions/:id/cancel', authenticate, validateRequest, createProxyHandler('/auctions/:id/cancel'));
router.get('/auctions/:id', authenticate, createProxyHandler('/auctions/:id'));
router.put('/auctions/:id', authenticate, validateRequest, createProxyHandler('/auctions/:id'));
router.get('/auctions', authenticate, createProxyHandler('/auctions'));
router.post('/auctions', authenticate, validateRequest, createProxyHandler('/auctions'));

// Bid Routes (specific routes first)
router.get('/bids/bidder/:id', authenticate, createProxyHandler('/bids/bidder/:id'));
router.get('/bids/efficiency', authenticate, createProxyHandler('/bids/efficiency'));
router.put('/bids/:id/withdraw', authenticate, createProxyHandler('/bids/:id/withdraw'));
router.put('/bids/:id', authenticate, validateRequest, createProxyHandler('/bids/:id'));
router.post('/bids', authenticate, validateRequest, createProxyHandler('/bids'));

export { router };