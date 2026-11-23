import Box from '@mui/material/Box';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const zoomIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const Overlay = styled(Box).attrs({
  role: 'dialog',
  'aria-modal': 'true',
})`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  z-index: 1300;
  animation: ${fadeIn} 180ms ease;
`;

export const Content = styled(Box)`
  max-width: 90vw;
  max-height: 90vh;
`;

export const LightBoxImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  animation: ${zoomIn} 180ms ease;
`;
