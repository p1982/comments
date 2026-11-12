'use client';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplyIcon from '@mui/icons-material/Reply';
import TagIcon from '@mui/icons-material/Tag';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import useCommentsStore from '@/store/comments/comments.store';

const defaultAvatarColor = '#90caf9';

const avatarColors = ['#90caf9', '#ce93d8', '#a5d6a7', '#ffcc80', '#80cbc4', '#f48fb1'];

const avatarColor = (name: string) => {
  let sum = 0;
  for (let index = 0; index < name.length; index += 1) {
    sum += name.charCodeAt(index);
  }
  return avatarColors[sum % avatarColors.length] ?? defaultAvatarColor;
};

const formatCommentDate = (value: string) => dayjs(value).format('DD.MM.YY [в] HH:mm');

const actionIconSx = { color: '#8b95a7', p: 0.5 };

const CommentCard = ({ id }: { id: string }) => {
  const comment = useCommentsStore((state) => state.comments[id]);

  if (!comment) {
    return null;
  }

  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <Box
      sx={{
        overflow: 'hidden',
        borderRadius: '10px',
        border: '1px solid #e6e8ec',
        bgcolor: '#fff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          py: 1.25,
          bgcolor: '#f4f6f8',
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: avatarColor(comment.fullName),
            color: '#1f2937',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initial}
        </Avatar>
        <Typography sx={{ fontWeight: 700, color: '#1f2937', fontSize: 15 }}>
          {comment.fullName}
        </Typography>
        <Typography sx={{ color: '#8b95a7', fontSize: 13, whiteSpace: 'nowrap' }}>
          {formatCommentDate(comment.createdAt)}
        </Typography>
        <Stack direction="row" spacing={0.25}>
          <IconButton size="small" aria-label="Link" sx={actionIconSx}>
            <TagIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" aria-label="Quote" sx={actionIconSx}>
            <FormatQuoteIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" aria-label="Reply" sx={actionIconSx}>
            <ReplyIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" aria-label="Add" sx={actionIconSx}>
            <AddCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ ml: 'auto', alignItems: 'center', color: '#8b95a7' }}
        >
          <IconButton size="small" aria-label="Upvote" sx={actionIconSx}>
            <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ minWidth: 12, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
            0
          </Typography>
          <IconButton size="small" aria-label="Downvote" sx={actionIconSx}>
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>
      <Typography
        sx={{
          px: 2.5,
          py: 2,
          color: '#4b5568',
          fontSize: 15,
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}
      >
        {comment.text}
      </Typography>
    </Box>
  );
};

export default CommentCard;
