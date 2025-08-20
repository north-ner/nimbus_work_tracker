from django.contrib.auth import get_user_model
User = get_user_model()

emails_seen = set()
duplicates = []

for user in User.objects.all().order_by('id'):
    if user.email in emails_seen:
        duplicates.append(user.pk)  # mark duplicates for deletion
    else:
        emails_seen.add(user.email)

# Delete duplicates
User.objects.filter(pk__in=duplicates).delete()

print(f"Deleted {len(duplicates)} duplicate users with non-unique emails.")
