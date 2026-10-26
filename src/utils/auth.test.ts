import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserAccessBranch,
  canUserAccessModule,
  validateDocumentNumber,
  validateEmail,
  isFirstAdminCandidate,
} from './auth';
import { ColmenaUser } from '../types';

test('canUserAccessBranch allows administrator into all branches', () => {
  const adminUser: ColmenaUser = {
    id: 'usr-admin',
    firebaseUid: 'fb-admin',
    fullName: 'Juan Administrador',
    documentNumber: '1020304050',
    email: 'admin@colmena.co',
    role: 'administrador',
    authorizedBranchIds: ['sede-chapinero'],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  assert.equal(canUserAccessBranch(adminUser, 'sede-chapinero'), true);
  assert.equal(canUserAccessBranch(adminUser, 'sede-parque93'), true);
  assert.equal(canUserAccessBranch(adminUser, 'otra-sede'), true);
});

test('canUserAccessBranch restricts non-admin to authorized branches only', () => {
  const cajeroUser: ColmenaUser = {
    id: 'usr-cajero',
    firebaseUid: 'fb-cajero',
    fullName: 'Carolina Cajera',
    documentNumber: '52304050',
    email: 'carolina@colmena.co',
    role: 'cajero',
    authorizedBranchIds: ['sede-chapinero'],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  assert.equal(canUserAccessBranch(cajeroUser, 'sede-chapinero'), true);
  assert.equal(canUserAccessBranch(cajeroUser, 'sede-parque93'), false);

  // If user is inactive, access is revoked
  cajeroUser.isActive = false;
  assert.equal(canUserAccessBranch(cajeroUser, 'sede-chapinero'), false);
});

test('canUserAccessModule enforces strict RBAC per role', () => {
  assert.equal(canUserAccessModule('administrador', 'usuarios'), true);
  assert.equal(canUserAccessModule('administrador', 'sucursales'), true);
  assert.equal(canUserAccessModule('administrador', 'caja'), true);

  // Cajero cannot access user management or branches
  assert.equal(canUserAccessModule('cajero', 'usuarios'), false);
  assert.equal(canUserAccessModule('cajero', 'sucursales'), false);
  assert.equal(canUserAccessModule('cajero', 'caja'), true);
  assert.equal(canUserAccessModule('cajero', 'cocina'), false);

  // Cocina only accesses kitchen and inventory
  assert.equal(canUserAccessModule('cocina', 'cocina'), true);
  assert.equal(canUserAccessModule('cocina', 'inventario'), true);
  assert.equal(canUserAccessModule('cocina', 'caja'), false);
  assert.equal(canUserAccessModule('cocina', 'usuarios'), false);
});

test('validateDocumentNumber and validateEmail validate correctly', () => {
  assert.equal(validateDocumentNumber('1020304050'), true);
  assert.equal(validateDocumentNumber('80.123.456'), true); // stripped
  assert.equal(validateDocumentNumber('123'), false); // too short

  assert.equal(validateEmail('juan@colmena.com'), true);
  assert.equal(validateEmail('invalido@'), false);
  assert.equal(validateEmail(''), false);
});

test('isFirstAdminCandidate identifies initial bootstrap eligibility', () => {
  assert.equal(isFirstAdminCandidate('cualquiera@test.com', 0), true);
  assert.equal(isFirstAdminCandidate('juan.santos.ieci@gmail.com', 5), true);
  assert.equal(isFirstAdminCandidate('otro@test.com', 5), false);
});
