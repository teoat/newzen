'use client';

import { useState } from 'react';
import { Modal, ConfirmModal } from './Modal';
import { Button } from '../button/Button';

export default {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        description="This is a description of the modal content."
      >
        <p className="text-slate-600">This is the main content of the modal.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
};

export const Small = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Small Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Small Modal"
        size="sm"
      >
        <p className="text-slate-600">This is a small modal.</p>
      </Modal>
    </>
  );
};

export const Large = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Large Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Large Modal"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-slate-600">This is a larger modal with more content.</p>
          <p className="text-slate-600">
            You can fit more content here and provide detailed information to the user.
          </p>
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-700">Additional content section</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const ExtraLarge = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open XL Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Extra Large Modal"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-slate-600">This is an extra large modal for complex content.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-slate-700">Section 1</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-slate-700">Section 2</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const ConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          alert('Confirmed!');
          setIsOpen(false);
        }}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export const ConfirmPrimary = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Save Changes</Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          alert('Saved!');
          setIsOpen(false);
        }}
        title="Save Changes"
        message="Do you want to save your changes before leaving?"
        confirmText="Save"
        cancelText="Discard"
        variant="primary"
      />
    </>
  );
};
