import { apiHandler, sendData, sendError } from '@/lib/api-utils';
import { CollectionName, Portfolio, PublishStatus } from '@/schemas/cms';
import mongoose from 'mongoose';
import { scopeQuery } from '@/lib/db/portfolio-utils';
import { sendCampaignEmail } from '@/lib/newsletter-engine';
import { getDb } from '@/lib/db/dbConnect';

export const POST = apiHandler(async (_request, { params }) => {
  const { id } = await params;
  const db = getDb();

  // 1. Fetch Campaign & Check Auth
  const campaignQuery = await scopeQuery({
    _id: new mongoose.Types.ObjectId(id),
  });
  const campaign = await db
    .collection(CollectionName.CAMPAIGNS)
    .findOne(campaignQuery);

  if (!campaign) return sendError('Campaign not found', 404);
  if (campaign.status === PublishStatus.SENT)
    return sendError('Campaign already sent', 400);

  // 2. Fetch Portfolio Settings
  const portfolio = (await db
    .collection(CollectionName.PORTFOLIOS)
    .findOne({ _id: campaign.portfolio })) as unknown as Portfolio;
  if (!portfolio) return sendError('Portfolio not found', 404);

  // 3. Fetch Subscribers
  const subscribers = await db
    .collection(CollectionName.SUBSCRIBERS)
    .find({ portfolio: campaign.portfolio, status: 'active' })
    .toArray();

  if (subscribers.length === 0)
    return sendError('No active subscribers found for this portfolio', 400);

  // 4. Update Status to Sending
  await db
    .collection('campaigns')
    .updateOne(
      { _id: campaign._id },
      { $set: { status: 'sending', updatedAt: new Date() } }
    );

  // 5. Trigger Sending
  try {
    const subscriberEmails = subscribers.map((s) => s.email);
    const result = await sendCampaignEmail({
      portfolio: portfolio,
      subject: campaign.subject,
      content: campaign.content,
      subscribers: subscriberEmails,
    });

    // 6. Final Update
    await db.collection(CollectionName.CAMPAIGNS).updateOne(
      { _id: campaign._id },
      {
        $set: {
          status: PublishStatus.SENT,
          recipientCount: result.sent,
          sentAt: new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    );

    return sendData({
      message: 'Campaign sent successfully',
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('CAMPAIGN_SEND_ERROR:', error);
    await db
      .collection(CollectionName.CAMPAIGNS)
      .updateOne(
        { _id: campaign._id },
        { $set: { status: PublishStatus.FAILED, updatedAt: new Date() } }
      );
    return sendError(
      'Failed to send campaign: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
});
