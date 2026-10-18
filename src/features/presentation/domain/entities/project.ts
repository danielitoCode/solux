/**
 * Domain entity: Completed or featured installation project (case study).
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  serviceCategory: string;
  completedAt: string; // ISO date
  imageUrls: string[];
}
