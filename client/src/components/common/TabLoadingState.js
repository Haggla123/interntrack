import React from 'react';
import { Loader } from 'lucide-react';

const TabLoadingState = ({ label = 'Refreshing tab data' }) => (
  <div className="tab-loading-state" role="status" aria-live="polite">
    <Loader size={26} className="tab-loading-icon" />
    <p>{label}</p>
  </div>
);

export default TabLoadingState;
