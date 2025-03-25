import { Router } from 'express'; // express@^4.18.2
import { AuctionController } from '../controllers/auction.controller';
import { AuctionService } from '../services/auction.service';
import { MarketEventsProducer } from '../producers/market-events.producer';
import { authenticate } from '../../../common/middleware/auth.middleware';

/**
 * Function to set up and configure the auction routes
 */
function setupAuctionRoutes(): Router {
  // Create a new instance of AuctionService
  const auctionService = new AuctionService();

  // Create a new instance of MarketEventsProducer
  const marketEventsProducer = new MarketEventsProducer();

  // Create a new instance of AuctionController with the service and producer
  const auctionController = new AuctionController(auctionService, marketEventsProducer);

  // Get the configured router from the controller
  const router = auctionController.getRouter();

  // Return the router
  return router;
}

// Create and export the router as the default export
export default setupAuctionRoutes();