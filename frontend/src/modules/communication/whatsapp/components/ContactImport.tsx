import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ContactImportProps {
  onImport: (file: File) => Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }>;
  onClose?: () => void;
  isImporting?: boolean;
}

/**
 * Contact Import Component
 * Import contacts from CSV file
 */
export const ContactImport: React.FC<ContactImportProps> = ({
  onImport,
  onClose,
  isImporting = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert('Veuillez sélectionner un fichier CSV');
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'import');
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `phoneNumber,name,email,tags,notes
+33612345678,Jean Dupont,jean@example.com,"client,vip",Client important
+33698765432,Marie Martin,marie@example.com,prospect,Prospect intéressé`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importer des contacts</h2>
            <p className="text-sm text-gray-600">Importez vos contacts depuis un fichier CSV</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {!result ? (
        <>
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2">
                  Glissez-déposez votre fichier CSV ici
                </p>
                <p className="text-sm text-gray-500 mb-4">ou</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  Sélectionner un fichier
                </label>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Format du fichier CSV</h3>
            <ul className="text-sm text-blue-800 space-y-1 mb-3">
              <li>• Colonnes requises: phoneNumber (format E.164, ex: +33612345678)</li>
              <li>• Colonnes optionnelles: name, email, tags, notes</li>
              <li>• Les tags doivent être séparés par des virgules entre guillemets</li>
              <li>• Encodage UTF-8 recommandé</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
            >
              <Download className="w-4 h-4" />
              Télécharger un fichier d'exemple
            </button>
          </div>

          {/* Import Button */}
          {file && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Importer les contacts
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Import Results */}
          <div className="space-y-4">
            {/* Success */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    {result.imported} contact{result.imported > 1 ? 's' : ''} importé
                    {result.imported > 1 ? 's' : ''} avec succès
                  </h3>
                  <p className="text-sm text-green-700">
                    Les contacts ont été ajoutés à votre liste
                  </p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">
                      {result.failed} erreur{result.failed > 1 ? 's' : ''}
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Importer un autre fichier
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
