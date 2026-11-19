'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { Card, Header } from './CommentCard.styled';

const CommentsListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} aria-busy="true">
          <Header>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="36%" height={18} />
              <Skeleton width="48%" height={14} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton width={72} height={14} />
          </Header>
          <Stack spacing={1} sx={{ px: 2.5, py: 2 }}>
            <Skeleton width="100%" height={16} />
            <Skeleton width="92%" height={16} />
            <Skeleton width="70%" height={16} />
          </Stack>
        </Card>
      ))}
    </>
  );
};

export default CommentsListSkeleton;
