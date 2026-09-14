import { Request, Response } from 'express';
import { smartPathService } from '../services/smartpath.service';
import { ICoordinatesPair, ISmartPathPreferences } from '@packleader/shared';

export class SmartPathController {
  public async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, preferences } = req.body as {
        origin: ICoordinatesPair;
        destination: ICoordinatesPair;
        preferences?: ISmartPathPreferences;
      };

      if (
        !origin ||
        origin.latitude === undefined ||
        origin.longitude === undefined ||
        !destination ||
        destination.latitude === undefined ||
        destination.longitude === undefined
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both origin and destination coordinates (latitude and longitude) are required.',
          },
        });
        return;
      }

      const recommendations = smartPathService.generateRecommendations(
        origin,
        destination,
        preferences
      );

      res.status(200).json({
        success: true,
        data: {
          recommendations,
          count: recommendations.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to compute SmartPath recommendations.',
        },
      });
    }
  }
}

export const smartPathController = new SmartPathController();
