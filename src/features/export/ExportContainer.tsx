import React from 'react';
import { ExportScreen } from './ExportScreen';
import { useExportData } from './useExportData';

type Props = {
  onBack: () => void;
};

export function ExportContainer({ onBack }: Props) {
  const data = useExportData();
  return <ExportScreen {...data} onBack={onBack} />;
}
