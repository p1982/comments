import { getApiUrl, type CommentAttachments } from '@comments/shared';

import { Content, LightBoxFrame, LightBoxImage, Overlay } from './FileLightBox.styled';

interface FileLightBoxProps {
  file: CommentAttachments;
  onClose: () => void;
}

const FileLightBox = ({ file, onClose }: FileLightBoxProps) => {
  const apiOrigin = getApiUrl().replace(/\/api\/v\d+$/, '');
  const src = `${apiOrigin}${file.url}`;

  return (
    <Overlay onClick={onClose}>
      <Content onClick={(event) => event.stopPropagation()}>
        {file.fileType === 'image' ? (
          <LightBoxImage src={src} alt={file.fileName} />
        ) : (
          <LightBoxFrame src={src} title={file.fileName} sandbox="" />
        )}
      </Content>
    </Overlay>
  );
};

export default FileLightBox;
