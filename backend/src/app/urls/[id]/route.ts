import { NextRequest } from 'next/server';
import { getUrlHandler, updateUrlHandler, deleteUrlHandler } from '../../../routes/url.routes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return await getUrlHandler(request, { params });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return await updateUrlHandler(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return await deleteUrlHandler(request, { params });
}
