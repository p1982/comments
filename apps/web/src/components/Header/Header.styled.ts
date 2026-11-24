import styled from 'styled-components';

export const HeaderRoot = styled.header`
  display: grid;
  grid-template-columns: 1fr minmax(0, 480px) 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e6e8ec;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr) auto;

    & > :first-child {
      display: none;
    }
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    padding: 10px 12px;
    gap: 10px;
  }
`;

export const HeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
  width: 100%;

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;

  button {
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    order: -1;
    width: 100%;
    justify-content: flex-end;
  }
`;
