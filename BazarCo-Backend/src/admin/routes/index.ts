import { Router } from "express";
import { adminRateLimit } from "../middleware/adminRateLimit.middleware";
import { requireAdminAuth } from "../middleware/requireAdminAuth.middleware";
import { requirePermission } from "../middleware/requirePermission.middleware";
import { PERMISSIONS } from "../constants/permissions";
import * as adminAuthController from "../controllers/adminAuthController";
import * as adminOverviewController from "../controllers/adminOverviewController";
import * as adminUsersController from "../controllers/adminUsersController";
import * as adminProductsController from "../controllers/adminProductsController";
import * as adminKycController from "../controllers/adminKycController";
import * as adminVideosController from "../controllers/adminVideosController";
import * as adminChatController from "../controllers/adminChatController";
import * as adminSystemController from "../controllers/adminSystemController";

const router = Router();

router.use(adminRateLimit);

router.post("/auth/login", adminAuthController.login);

router.use(requireAdminAuth);

router.get("/auth/me", adminAuthController.me);
router.get("/overview", requirePermission(PERMISSIONS.SYSTEM_READ), adminOverviewController.getOverview);

router.get("/users", requirePermission(PERMISSIONS.USERS_READ), adminUsersController.listUsers);
router.get("/users/export", requirePermission(PERMISSIONS.USERS_EXPORT), adminUsersController.exportUsers);
router.post("/users", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.createUser);
router.post("/users/bulk", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.bulkAction);
router.get("/users/:id", requirePermission(PERMISSIONS.USERS_READ), adminUsersController.getUser);
router.patch("/users/:id", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.updateUser);
router.post("/users/:id/suspend", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.suspendUser);
router.post("/users/:id/unsuspend", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.unsuspendUser);
router.post("/users/:id/soft-delete", requirePermission(PERMISSIONS.USERS_DELETE), adminUsersController.softDeleteUser);
router.post("/users/:id/restore", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.restoreUser);
router.delete("/users/:id/permanent", requirePermission(PERMISSIONS.USERS_DELETE), adminUsersController.permanentDeleteUser);
router.post("/users/:id/force-logout", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.forceLogoutUser);
router.post("/users/:id/reset-password", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.resetUserPassword);
router.post("/users/:id/messaging-ban", requirePermission(PERMISSIONS.USERS_WRITE), adminUsersController.banMessaging);

router.get("/products", requirePermission(PERMISSIONS.PRODUCTS_READ), adminProductsController.listProducts);
router.get("/products/:id", requirePermission(PERMISSIONS.PRODUCTS_READ), adminProductsController.getProduct);
router.patch("/products/:id", requirePermission(PERMISSIONS.PRODUCTS_WRITE), adminProductsController.updateProduct);
router.post("/products/:id/flag", requirePermission(PERMISSIONS.PRODUCTS_MODERATE), adminProductsController.flagProduct);
router.post("/products/:id/soft-delete", requirePermission(PERMISSIONS.PRODUCTS_DELETE), adminProductsController.softDeleteProduct);
router.post("/products/:id/restore", requirePermission(PERMISSIONS.PRODUCTS_WRITE), adminProductsController.restoreProduct);
router.post("/products/:id/featured", requirePermission(PERMISSIONS.PRODUCTS_WRITE), adminProductsController.setFeatured);
router.post("/products/bulk", requirePermission(PERMISSIONS.PRODUCTS_MODERATE), adminProductsController.bulkModerate);
router.get("/categories", requirePermission(PERMISSIONS.CATEGORIES_MANAGE), adminProductsController.listCategories);

router.get("/kyc", requirePermission(PERMISSIONS.KYC_READ), adminKycController.listKyc);
router.get("/kyc/:id", requirePermission(PERMISSIONS.KYC_READ), adminKycController.getKycDetail);
router.post("/kyc/:id/approve", requirePermission(PERMISSIONS.KYC_REVIEW), adminKycController.approveKyc);
router.post("/kyc/:id/reject", requirePermission(PERMISSIONS.KYC_REVIEW), adminKycController.rejectKyc);

router.get("/videos", requirePermission(PERMISSIONS.VIDEOS_READ), adminVideosController.listVideos);
router.get("/videos/:id", requirePermission(PERMISSIONS.VIDEOS_READ), adminVideosController.getVideo);
router.patch("/videos/:id", requirePermission(PERMISSIONS.VIDEOS_WRITE), adminVideosController.updateVideoStatus);
router.delete("/videos/:id", requirePermission(PERMISSIONS.VIDEOS_DELETE), adminVideosController.deleteVideo);
router.post("/videos/bulk-delete", requirePermission(PERMISSIONS.VIDEOS_DELETE), adminVideosController.bulkDeleteVideos);
router.post("/videos/disable-seller/:sellerId", requirePermission(PERMISSIONS.VIDEOS_WRITE), adminVideosController.disableSellerVideos);

router.get("/chat/conversations", requirePermission(PERMISSIONS.CHAT_READ), adminChatController.listConversations);
router.get("/chat/conversations/:id/messages", requirePermission(PERMISSIONS.CHAT_READ), adminChatController.getConversationMessages);
router.get("/chat/messages", requirePermission(PERMISSIONS.CHAT_READ), adminChatController.searchMessages);
router.post("/chat/messages/:messageId/delete", requirePermission(PERMISSIONS.CHAT_MODERATE), adminChatController.deleteMessage);
router.post("/chat/messages/:messageId/flag", requirePermission(PERMISSIONS.CHAT_MODERATE), adminChatController.flagMessage);

router.get("/system/diagnostics", requirePermission(PERMISSIONS.SYSTEM_READ), adminSystemController.diagnostics);
router.get("/audit-logs", requirePermission(PERMISSIONS.AUDIT_READ), adminSystemController.listAuditLogs);
router.post("/system/refresh-collections", requirePermission(PERMISSIONS.SYSTEM_MAINTENANCE), adminSystemController.refreshCollections);
router.post("/system/rebuild-indexes", requirePermission(PERMISSIONS.SYSTEM_MAINTENANCE), adminSystemController.rebuildIndexes);
router.post("/system/clear-cache", requirePermission(PERMISSIONS.SYSTEM_MAINTENANCE), adminSystemController.clearCache);
router.post("/system/jobs", requirePermission(PERMISSIONS.SYSTEM_MAINTENANCE), adminSystemController.runMaintenanceJob);

export const adminRouter = router;
