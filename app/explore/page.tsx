"use client";

import React, { useState } from "react";
import ResourceCard from "@/components/ResourceCard";
import ResourceModal from "@/components/ResourceModal";
import { resourcesData, ResourceInterface } from "@/data/resources";

export default function ExploreResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<ResourceInterface | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourcesData, setResourcesData] = useState<ResourceInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories for filtering
  const categories = ["All", "Academic", "Research", "Public", "Facilities"];
  const [activeCategory, setActiveCategory] = useState("All");

  React.useEffect(() => {
    fetch('http://localhost:5000/api/resources', {
      headers: {
        'Authorization': `Bearer dev-token`
      }
    })
      .then(res => res.json())
      .then(data => {
        // Map backend resources to frontend interface
        const mapped = data.data?.map((r: any) => ({
          id: r.id.toString(),
          name: r.name,
          category: r.type === 'Labs' ? 'Research' : r.type === 'Lecture Halls' ? 'Academic' : 'Facilities',
          image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800", // placeholder
          location: r.location || "Main Campus",
          capacity: r.capacity || 0,
          status: r.availability_status === 'Available' ? 'Available' : 'Booked',
          description: "Resource provided by university.",
          amenities: ["Wi-Fi", "Whiteboard"]
        })) || [];
        setResourcesData(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredResources = resourcesData.filter((res) => 
    activeCategory === "All" ? true : res.category === activeCategory
  );

  const handleOpenModal = (resource: ResourceInterface) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = "hidden";
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedResource(null), 300); // Wait for transition
    document.body.style.overflow = "auto";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 text-center md:text-left md:flex md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            University Resources
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Browse and book state-of-the-art facilities, laboratories, and study spaces across the campus.
          </p>
        </div>
        
        {/* Simple Category Filter */}
        <div className="mt-6 md:mt-0 flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {loading ? (
        <div className="max-w-7xl mx-auto py-20 text-center">
            <p className="text-slate-500 text-lg">Loading resources...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.map((resource) => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onClick={() => handleOpenModal(resource)} 
            />
          ))}
        </div>
      )}

      {!loading && filteredResources.length === 0 && (
        <div className="max-w-3xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 mt-8">
          <p className="text-slate-500 text-lg font-medium">No resources found in this category.</p>
        </div>
      )}

      {/* Modal */}
      <ResourceModal 
        resource={selectedResource} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}
