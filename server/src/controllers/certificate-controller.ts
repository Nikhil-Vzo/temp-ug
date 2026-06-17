import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as certificateService from '../services/certificate-service.js';

// ==========================================
// 1. Generate Certificate (Normally Internal)
// ==========================================
export const generateCertificate = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || req.body.userId || "6a2fde02acf82e9382a4ad9b";
  const { courseId } = req.body;

  const certificate = await certificateService.generate_certificate(userId, courseId);

  res.status(201).json({
    status: 'success',
    data: { certificate }
  });
});

// ==========================================
// 2. Retrieve My Certificates
// ==========================================
export const getMyCertificates = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id || "6a2fde02acf82e9382a4ad9b";

  const certificates = await certificateService.get_my_certificates(userId);

  res.status(200).json({
    status: 'success',
    results: certificates.length,
    data: { certificates }
  });
});

// ==========================================
// 3. Verify Certificate Validity (Public Route)
// ==========================================
export const verifyCertificate = catchAsync(async (req: any, res: Response) => {
  const { certificateCode } = req.params;

  const certificate = await certificateService.verify_certificate(certificateCode);

  res.status(200).json({
    status: 'success',
    data: { certificate }
  });
});
