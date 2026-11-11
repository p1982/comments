import { AttachmentsEntity } from '../../attachments/entity/attachments.entity';
import { CommentsEntity } from './comments.entity';
import { OutboxEventsEntity } from '../../outbox/entity/outbox.entity';
import { UserEntity } from '../../users/entity/user.entity';

describe('comment entities', () => {
  it('can be constructed', () => {
    expect(new CommentsEntity()).toBeInstanceOf(CommentsEntity);
    expect(new UserEntity()).toBeInstanceOf(UserEntity);
    expect(new AttachmentsEntity()).toBeInstanceOf(AttachmentsEntity);
    expect(new OutboxEventsEntity()).toBeInstanceOf(OutboxEventsEntity);
  });
});
