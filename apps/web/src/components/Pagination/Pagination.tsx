import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

interface PaginationProps {
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
}

export default function PaginationOutlined({ totalPages, page, onPageChange }: PaginationProps) {
  return (
    <Stack spacing={2}>
      <Pagination
        page={page}
        count={totalPages}
        onChange={(_event, value) => onPageChange(value)}
        variant="outlined"
        color="primary"
      />
    </Stack>
  );
}
