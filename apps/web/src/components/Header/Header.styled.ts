import styled from 'styled-components';

export const HeaderRoot = styled.header`
  display: grid;
  grid-template-columns: 1fr minmax(0, 480px) 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
`;

export const HeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;
