import fs from 'fs';
let c = fs.readFileSync('src/contexts/TransactionContext.tsx', 'utf8');

c = c.replace('if (!isOnline) {\n      if (!id.startsWith(\'temp_\')) {\n        enqueue({ table: \'transactions\', action: \'update\', payload: updateData, entityId: id });\n      }\n      return;\n    }', `if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'transactions', action: 'update', payload: updateData, entityId: id });
      } else {
        if (updateInQueue) updateInQueue(id, updateData);
      }
      return;
    }`);

c = c.replace('if (!isOnline) {\n      if (!id.startsWith(\'temp_\')) {\n        enqueue({ table: \'transactions\', action: \'delete\', entityId: id });\n        if (linkedId && !linkedId.startsWith(\'temp_\')) {\n           enqueue({ table: \'transactions\', action: \'delete\', entityId: linkedId });\n        }\n      }\n      return;\n    }', `if (!isOnline) {
      if (!id.startsWith('temp_')) {
        enqueue({ table: 'transactions', action: 'delete', entityId: id });
        if (linkedId && !linkedId.startsWith('temp_')) {
           enqueue({ table: 'transactions', action: 'delete', entityId: linkedId });
        }
      } else {
        if (removeFromQueueByTempId) removeFromQueueByTempId(id);
      }
      return;
    }`);

fs.writeFileSync('src/contexts/TransactionContext.tsx', c);
