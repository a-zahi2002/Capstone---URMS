import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { SavedSearchModel } from "../models/savedSearch.model";

export const getSavedSearches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const data = await SavedSearchModel.findAll(userId, req.supabase);
    res.json({ status: "success", data });
  } catch (error: any) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createSavedSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const { name, search_parameters } = req.body;
    if (!name || !search_parameters) {
      res.status(400).json({
        status: "error",
        message: "Missing required fields: name, search_parameters",
      });
      return;
    }

    const created = await SavedSearchModel.create(
      {
        user_id: userId,
        name,
        search_parameters,
      },
      req.supabase
    );

    res.status(201).json({ status: "success", data: created });
  } catch (error: any) {
    console.error("Error creating saved search:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateSavedSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ status: "error", message: "Missing required field: name" });
      return;
    }

    // Verify ownership first
    const existing = await SavedSearchModel.findById(id, req.supabase);
    if (!existing) {
      res.status(404).json({ status: "error", message: "Saved search not found" });
      return;
    }

    if (existing.user_id !== userId) {
      res.status(403).json({ status: "error", message: "Access denied: You do not own this saved search" });
      return;
    }

    const updated = await SavedSearchModel.update(id, name, req.supabase);
    res.json({ status: "success", data: updated });
  } catch (error: any) {
    console.error("Error updating saved search:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteSavedSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;

    // Verify ownership first
    const existing = await SavedSearchModel.findById(id, req.supabase);
    if (!existing) {
      res.status(404).json({ status: "error", message: "Saved search not found" });
      return;
    }

    if (existing.user_id !== userId) {
      res.status(403).json({ status: "error", message: "Access denied: You do not own this saved search" });
      return;
    }

    await SavedSearchModel.delete(id, req.supabase);
    res.json({ status: "success", message: "Saved search deleted" });
  } catch (error: any) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
