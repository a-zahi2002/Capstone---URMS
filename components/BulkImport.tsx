import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, XCircle, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface BulkImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImport({ isOpen, onClose, onSuccess }: BulkImportProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setSuccessMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAndReset = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".xlsx")) {
      setErrors(["Invalid file format. Please upload .csv or .xlsx files only."]);
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rawJsonData = XLSX.utils.sheet_to_json<any>(sheet);
        
        // Make keys case-insensitive by converting them tightly to lower case
        const jsonData = rawJsonData.map(row => {
          const formattedRow: any = {};
          Object.keys(row).forEach(key => {
            formattedRow[key.toString().toLowerCase().trim()] = row[key];
          });
          return formattedRow;
        });
        
        validateData(jsonData);
      } catch (err) {
        setErrors(["Failed to parse file. Ensure it is a valid CSV or Excel file."]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateData = (data: any[]) => {
    if (data.length === 0) {
      setErrors(["The file contains no data."]);
      return;
    }

    const validStatuses = ["Available", "Booked", "Maintenance"];

    const validatedData = data.map((row, index) => {
      // Automatically fill correct data formats instead of halting import
      const name = row.name ? String(row.name).trim() : `Imported Resource ${index + 1}`;
      const type = row.type ? String(row.type).trim() : "Rooms";
      const location = row.location ? String(row.location).trim() : "Main Campus";
      
      let capacity = parseInt(row.capacity);
      if (isNaN(capacity)) {
        capacity = 0; // Default to 0
      }

      let status = row.status || "Available";
      if (!validStatuses.includes(status)) {
        status = "Available"; // Fallback to Available
      }

      return {
        name,
        type,
        capacity,
        location,
        availability_status: status,
      };
    });

    setErrors([]);
    setParsedData(validatedData);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsLoading(true);
    setErrors([]);

    try {
      const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
      
      const response = await fetch("http://localhost:5000/api/resources/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resources: parsedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to import resources");
      }

      setSuccessMsg(data.message || `${parsedData.length} resources imported successfully!`);
      setTimeout(() => {
        onSuccess();
        closeAndReset();
      }, 2000);

    } catch (err: any) {
      setErrors([err.message || "Server error occurred during import."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeAndReset} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-[#1E3A8A]">Bulk Import Resources</h2>
          <button onClick={closeAndReset} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Import Successful!</h3>
              <p className="text-slate-500">{successMsg}</p>
            </div>
          ) : (
            <>
              {/* Upload Dropzone */}
              {!file && (
                <div 
                  className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Upload CSV or Excel File</h3>
                  <p className="text-slate-500 text-sm mb-4">Drag and drop or click to browse</p>
                  <p className="text-xs text-slate-400">Required columns: name, type, location, capacity, status</p>
                  
                  <input 
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* File Info & Errors */}
              {file && (
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={resetState}
                      className="text-sm font-semibold text-red-500 hover:text-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>

                  {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <p className="font-bold text-red-700 text-sm mb-1">Validation Errors Found:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Preview */}
              {parsedData.length > 0 && errors.length === 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
                    Data Preview 
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                      {parsedData.length} records ready
                    </span>
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-auto max-h-60">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3 text-center">Capacity</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedData.slice(0, 10).map((row, i) => (
                            <tr key={i} className="bg-white hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                              <td className="px-4 py-3">{row.type}</td>
                              <td className="px-4 py-3">{row.location}</td>
                              <td className="px-4 py-3 text-center">{row.capacity}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${row.availability_status === 'Available' ? 'bg-emerald-100 text-emerald-700' : row.availability_status === 'Booked' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {row.availability_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {parsedData.length > 10 && (
                    <p className="text-xs text-right text-slate-400 mt-2">Showing 10 of {parsedData.length} records</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!successMsg && (
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button 
              onClick={closeAndReset}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={parsedData.length === 0 || errors.length > 0 || isLoading}
              onClick={handleImport}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${parsedData.length > 0 ? parsedData.length : ''} Resources`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
