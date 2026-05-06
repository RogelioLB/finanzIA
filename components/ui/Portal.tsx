import React, { ReactNode } from 'react';
import PortalHost from '@gorhom/portal';

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  return <PortalHost>{children}</PortalHost>;
}

export { PortalHost };
