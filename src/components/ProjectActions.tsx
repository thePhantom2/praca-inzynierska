import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { useProjects } from '@/context/projects';
import { type Project } from '@/storage/projectsStorage';
import { createThemedStyles } from '@/theme/ThemeProvider';

type ProjectActionsProps = {
  project: Project;
  onArchived?: () => void;
  onDeleted?: () => void;
};

export function ProjectActions({ project, onArchived, onDeleted }: ProjectActionsProps) {
  const styles = useStyles();
  const { archiveProject, removeProject, saving, setError } = useProjects();
  const [pendingAction, setPendingAction] = useState<'archive' | 'delete' | null>(null);

  async function confirm() {
    const success = pendingAction === 'archive'
      ? await archiveProject(project.id)
      : await removeProject(project.id);

    if (success) {
      setPendingAction(null);
      if (pendingAction === 'archive') onArchived?.();
      if (pendingAction === 'delete') onDeleted?.();
    }
  }

  if (pendingAction) {
    return (
      <View style={styles.actions}>
        <Text style={styles.message}>
          {pendingAction === 'archive'
            ? `Zakończyć projekt „${project.name}” i przenieść go do archiwum wraz ze wszystkimi zadaniami?`
            : `Trwale usunąć projekt „${project.name}” wraz ze wszystkimi zadaniami?`}
        </Text>
        <PrimaryButton
          label={saving ? 'Zapisywanie…' : pendingAction === 'archive' ? 'Zakończ i archiwizuj' : 'Usuń trwale'}
          variant={pendingAction === 'delete' ? 'danger' : 'primary'}
          disabled={saving}
          onPress={() => { void confirm(); }}
        />
        <PrimaryButton
          label="Anuluj"
          variant="outline"
          disabled={saving}
          onPress={() => { setPendingAction(null); setError(''); }}
        />
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      {!project.completedAt ? (
        <PrimaryButton
          label="Zakończ projekt"
          variant="outline"
          disabled={saving}
          onPress={() => { setError(''); setPendingAction('archive'); }}
        />
      ) : null}
      <PrimaryButton
        label="Usuń projekt"
        variant="danger"
        disabled={saving}
        onPress={() => { setError(''); setPendingAction('delete'); }}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  actions: { gap: 10 },
  message: { fontSize: 14, lineHeight: 21, color: colors.text },
}));
