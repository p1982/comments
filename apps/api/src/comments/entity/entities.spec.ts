import { AttachmentsEntity } from '../../attachments/entity/attachments.entity';
import { CommentsEntity } from './comments.entity';
import { OutboxEventsEntity } from '../../outbox/entity/outbox.entity';
import { UsersEntity } from '../../users/entity/users.entity';

describe('comment entities', () => {
  it('can be constructed', () => {
    expect(new CommentsEntity()).toBeInstanceOf(CommentsEntity);
    expect(new UsersEntity()).toBeInstanceOf(UsersEntity);
    expect(new AttachmentsEntity()).toBeInstanceOf(AttachmentsEntity);
    expect(new OutboxEventsEntity()).toBeInstanceOf(OutboxEventsEntity);
  });
});
