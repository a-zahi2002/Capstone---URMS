/**
 * resourceCtrl.ts
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for /api/resources.
 * All data access now goes through ResourceModel (Supabase).
 * API endpoints, request/response shapes, and business logic
 * are unchanged from the MySQL version.
 * ─────────────────────────────────────────────────────────────
 */
import { Response } from "express";
import { ResourceModel } from "../models/resource.model";
import { AuthRequest } from "../middleware/auth.middleware";

// ── GET /api/resources ─────────────────────────────────────
export const getResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resources = await ResourceModel.findAll(req.supabase);
    res.json({ data: resources });
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── POST /api/resources ────────────────────────────────────
export const addResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, capacity, location, availability_status, equipment, department } = req.body;

    const newId = await ResourceModel.create({
      name,
      type,
      capacity,
      location,
      availability_status,
      equipment: equipment || [],
      department: department || null
    }, req.supabase);

    res.json({ message: "Resource added", id: newId });
  } catch (error: any) {
    console.error("Error adding resource:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── PATCH /api/resources/:id ───────────────────────────────
export const updateResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, type, capacity, location, availability_status, equipment, department } = req.body;

    const success = await ResourceModel.update(id, {
      name,
      type,
      capacity,
      location,
      availability_status,
      equipment: equipment || [],
      department: department
    }, req.supabase);

    if (!success) {
      res.status(404).json({ status: "error", message: "Resource not found" });
      return;
    }

    res.json({ message: "Updated" });
  } catch (error: any) {
    console.error("Error updating resource:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── DELETE /api/resources/:id ──────────────────────────────
export const deleteResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const success = await ResourceModel.delete(id, req.supabase);

    if (!success) {
      res.status(404).json({ status: "error", message: "Resource not found" });
      return;
    }

    res.json({ message: "Deleted" });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── POST /api/resources/import  (Bulk Import) ─────────────
export const importResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resources } = req.body;

    if (!resources || !Array.isArray(resources) || resources.length === 0) {
      res.status(400).json({ status: "error", message: "No valid resources array provided" });
      return;
    }

    // Insert each resource via the model (maintains validation + mock fallback)
    const insertedIds: string[] = [];
    for (const r of resources) {
      const id = await ResourceModel.create({
        name:                r.name,
        type:                r.type               || "Lecture Halls",
        capacity:            r.capacity           || "0",
        location:            r.location,
        availability_status: r.availability_status || "Available",
        equipment:           r.equipment          || [],
        department:          r.department         || null
      }, req.supabase);
      insertedIds.push(id);
    }

    res.json({
      status:  "success",
      message: `${insertedIds.length} resources imported successfully!`,
      count:   insertedIds.length
    });
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ status: "error", message: "Database insert failed" });
  }
};